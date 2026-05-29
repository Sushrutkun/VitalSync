package com.vitalsync

import org.apache.spark.sql.SparkSession
import org.apache.hadoop.security.UserGroupInformation

trait SparkSessionWrapper {

    System.setProperty("java.security.auth.useSubjectCredsOnly", "false")
    System.setProperty("HADOOP_USER_NAME", "spark")

    UserGroupInformation.setLoginUser(
      UserGroupInformation.createRemoteUser("spark")
    )

    val spark: SparkSession = SparkSession
      .builder()
      .appName("Build a DataFrame from Scratch")
      .master("local[*]")
      .config("spark.driver.host", "127.0.0.1")
      .getOrCreate()

}